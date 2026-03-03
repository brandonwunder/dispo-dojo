"""Pipeline orchestrator — runs the 3-pass search for each agent."""

import asyncio
import logging
from typing import Callable

import httpx

from .models import AgentRow, ContactResult, ContactStatus
from .searchers.google_search import search_google
from .searchers.realtor_profile import search_realtor_profile
from .searchers.email_guesser import guess_email
from .searchers.helpers import random_delay

logger = logging.getLogger("agent_finder.pipeline")


async def run_pipeline(
    agents: list[AgentRow],
    progress_callback: Callable[[dict], None] | None = None,
) -> list[ContactResult]:
    """Run the 3-pass search pipeline on a list of agents.

    Pass 1: Google search (all agents)
    Pass 2: Realtor.com profile (agents not found in Pass 1)
    Pass 3: Email pattern guessing (agents with no email)
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

    logger.info("Pass 1: Google search for %d agents", total)

    async with httpx.AsyncClient(
        follow_redirects=True,
        limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
    ) as client:

        for i, agent in enumerate(agents):
            emit_progress(agent.name, "google")

            try:
                result = await search_google(agent, client)
                results[i] = result

                if result.has_contact:
                    found_count += 1
            except Exception as e:
                logger.error("Pass 1 error for %s: %s", agent.name, e)
                results[i] = ContactResult(
                    agent=agent,
                    status=ContactStatus.ERROR,
                    error_message=str(e),
                )

            completed_count += 1
            emit_progress(agent.name, "google")

            if i < total - 1:
                await random_delay(3.0, 7.0)

        # Pass 2: Realtor.com profiles (for agents not found)
        not_found_indices = [
            i for i, r in enumerate(results)
            if not r.has_contact
        ]

        if not_found_indices:
            logger.info("Pass 2: Realtor.com profiles for %d agents", len(not_found_indices))

            for i in not_found_indices:
                agent = agents[i]
                emit_progress(agent.name, "realtor")

                profile_url = ""
                if results[i].error_message.startswith("realtor_url:"):
                    profile_url = results[i].error_message.replace("realtor_url:", "")

                try:
                    realtor_result = await search_realtor_profile(agent, client, profile_url)

                    if realtor_result.has_contact:
                        if realtor_result.phone and not results[i].phone:
                            results[i].phone = realtor_result.phone
                        if realtor_result.email and not results[i].email:
                            results[i].email = realtor_result.email
                        results[i].source = "realtor"
                        results[i].status = ContactStatus.FOUND
                        results[i].error_message = ""
                        found_count += 1
                except Exception as e:
                    logger.error("Pass 2 error for %s: %s", agent.name, e)

                emit_progress(agent.name, "realtor")
                await random_delay(1.5, 3.5)

        # Pass 3: Email pattern guessing (for agents with phone but no email)
        need_email_indices = [
            i for i, r in enumerate(results)
            if r.phone and not r.email
        ]

        if need_email_indices:
            logger.info("Pass 3: Email guessing for %d agents", len(need_email_indices))

            for i in need_email_indices:
                agent = agents[i]
                emit_progress(agent.name, "email_guess")

                try:
                    guessed = await guess_email(agent.name, agent.brokerage, client)
                    if guessed:
                        results[i].email = guessed
                        if results[i].source:
                            results[i].source += "+email_guess"
                        else:
                            results[i].source = "email_guess"
                except Exception as e:
                    logger.debug("Email guess error for %s: %s", agent.name, e)

                emit_progress(agent.name, "email_guess")
                await random_delay(3.0, 6.0)

    # Clean up temp error messages
    for r in results:
        if r.status == ContactStatus.ERROR and r.error_message.startswith("realtor_url:"):
            r.error_message = ""
            r.status = ContactStatus.NOT_FOUND

    logger.info(
        "Pipeline complete: %d/%d found (%d%%)",
        found_count, total,
        round(found_count / total * 100) if total > 0 else 0,
    )

    return results
