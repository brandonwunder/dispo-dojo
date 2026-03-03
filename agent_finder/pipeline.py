"""Pipeline orchestrator — runs the 3-pass search for each agent.

Uses concurrent batches to speed up processing while respecting
rate limits. Each batch runs N searches in parallel, then pauses
briefly before the next batch.
"""

import asyncio
import logging
from typing import Callable

import httpx

from .models import AgentRow, ContactResult, ContactStatus
from .searchers.google_search import search_google
from .searchers.realtor_profile import search_realtor_profile
from .searchers.email_guesser import guess_email

logger = logging.getLogger("agent_finder.pipeline")

# Concurrency settings — tuned for DuckDuckGo rate limits
DDG_BATCH_SIZE = 5       # concurrent searches per batch
DDG_BATCH_DELAY = 2.0    # seconds between batches
REALTOR_BATCH_SIZE = 3   # realtor.com is stricter
REALTOR_BATCH_DELAY = 2.0
EMAIL_BATCH_SIZE = 8     # email guessing is mostly DNS, can be aggressive
EMAIL_BATCH_DELAY = 0.5
AGENT_TIMEOUT = 30.0     # max seconds per agent before we skip it


async def run_pipeline(
    agents: list[AgentRow],
    progress_callback: Callable[[dict], None] | None = None,
) -> list[ContactResult]:
    """Run the 3-pass search pipeline on a list of agents.

    Pass 1: DuckDuckGo search (all agents) — batches of 5
    Pass 2: Realtor.com profile (agents not found in Pass 1) — batches of 3
    Pass 3: Email pattern guessing (agents with no email) — batches of 8
    """
    total = len(agents)
    results: list[ContactResult] = [ContactResult(agent=a) for a in agents]

    found_count = 0
    completed_count = 0

    def emit_progress(current_agent: str, phase: str):
        if progress_callback:
            progress_callback({
                "completed": completed_count,
                "total": total,
                "found": found_count,
                "not_found": completed_count - found_count,
                "current_agent": current_agent,
                "phase": phase,
            })

    logger.info("Pass 1: DuckDuckGo search for %d agents", total)

    async with httpx.AsyncClient(
        follow_redirects=True,
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    ) as client:

        # --- Pass 1: DuckDuckGo search in concurrent batches ---
        for batch_start in range(0, total, DDG_BATCH_SIZE):
            batch_end = min(batch_start + DDG_BATCH_SIZE, total)
            batch_indices = list(range(batch_start, batch_end))

            # Show progress for first agent in batch
            emit_progress(agents[batch_start].name, "google")

            async def search_one(idx: int) -> None:
                nonlocal found_count, completed_count
                agent = agents[idx]
                try:
                    result = await asyncio.wait_for(
                        search_google(agent, client),
                        timeout=AGENT_TIMEOUT,
                    )
                    results[idx] = result
                    if result.has_contact:
                        found_count += 1
                except asyncio.TimeoutError:
                    logger.warning("Pass 1 timed out for %s (>%ds)", agent.name, AGENT_TIMEOUT)
                    results[idx] = ContactResult(
                        agent=agent,
                        status=ContactStatus.ERROR,
                        error_message="Timeout",
                    )
                except Exception as e:
                    logger.error("Pass 1 error for %s: %s", agent.name, e)
                    results[idx] = ContactResult(
                        agent=agent,
                        status=ContactStatus.ERROR,
                        error_message=str(e),
                    )
                completed_count += 1

            # Run batch concurrently
            await asyncio.gather(*(search_one(i) for i in batch_indices))

            # Emit progress after batch completes
            emit_progress(agents[batch_end - 1].name, "google")

            # Delay between batches (skip after last batch)
            if batch_end < total:
                await asyncio.sleep(DDG_BATCH_DELAY)

        # --- Pass 2: Realtor.com profiles for agents not found ---
        not_found_indices = [
            i for i, r in enumerate(results)
            if not r.has_contact
        ]

        if not_found_indices:
            logger.info("Pass 2: Realtor.com profiles for %d agents", len(not_found_indices))

            for batch_start in range(0, len(not_found_indices), REALTOR_BATCH_SIZE):
                batch = not_found_indices[batch_start:batch_start + REALTOR_BATCH_SIZE]

                emit_progress(agents[batch[0]].name, "realtor")

                async def search_realtor_one(idx: int) -> None:
                    nonlocal found_count
                    agent = agents[idx]
                    profile_url = ""
                    if results[idx].error_message and results[idx].error_message.startswith("realtor_url:"):
                        profile_url = results[idx].error_message.replace("realtor_url:", "")

                    try:
                        realtor_result = await asyncio.wait_for(
                            search_realtor_profile(agent, client, profile_url),
                            timeout=AGENT_TIMEOUT,
                        )
                        if realtor_result.has_contact:
                            if realtor_result.phone and not results[idx].phone:
                                results[idx].phone = realtor_result.phone
                            if realtor_result.email and not results[idx].email:
                                results[idx].email = realtor_result.email
                            results[idx].source = "realtor"
                            results[idx].status = ContactStatus.FOUND
                            results[idx].error_message = ""
                            found_count += 1
                    except asyncio.TimeoutError:
                        logger.warning("Pass 2 timed out for %s (>%ds)", agent.name, AGENT_TIMEOUT)
                    except Exception as e:
                        logger.error("Pass 2 error for %s: %s", agent.name, e)

                await asyncio.gather(*(search_realtor_one(i) for i in batch))

                emit_progress(agents[batch[-1]].name, "realtor")

                if batch_start + REALTOR_BATCH_SIZE < len(not_found_indices):
                    await asyncio.sleep(REALTOR_BATCH_DELAY)

        # --- Pass 3: Email pattern guessing for agents with phone but no email ---
        need_email_indices = [
            i for i, r in enumerate(results)
            if r.phone and not r.email
        ]

        if need_email_indices:
            logger.info("Pass 3: Email guessing for %d agents", len(need_email_indices))

            for batch_start in range(0, len(need_email_indices), EMAIL_BATCH_SIZE):
                batch = need_email_indices[batch_start:batch_start + EMAIL_BATCH_SIZE]

                emit_progress(agents[batch[0]].name, "email_guess")

                async def guess_one(idx: int) -> None:
                    agent = agents[idx]
                    try:
                        guessed = await asyncio.wait_for(
                            guess_email(agent.name, agent.brokerage, client),
                            timeout=AGENT_TIMEOUT,
                        )
                        if guessed:
                            results[idx].email = guessed
                            if results[idx].source:
                                results[idx].source += "+email_guess"
                            else:
                                results[idx].source = "email_guess"
                    except asyncio.TimeoutError:
                        logger.warning("Pass 3 timed out for %s (>%ds)", agent.name, AGENT_TIMEOUT)
                    except Exception as e:
                        logger.debug("Email guess error for %s: %s", agent.name, e)

                await asyncio.gather(*(guess_one(i) for i in batch))

                emit_progress(agents[batch[-1]].name, "email_guess")

                if batch_start + EMAIL_BATCH_SIZE < len(need_email_indices):
                    await asyncio.sleep(EMAIL_BATCH_DELAY)

    # Clean up temp error messages
    for r in results:
        if r.status == ContactStatus.ERROR and r.error_message and r.error_message.startswith("realtor_url:"):
            r.error_message = ""
            r.status = ContactStatus.NOT_FOUND

    logger.info(
        "Pipeline complete: %d/%d found (%d%%)",
        found_count, total,
        round(found_count / total * 100) if total > 0 else 0,
    )

    return results
