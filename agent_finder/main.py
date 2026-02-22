"""Agent Finder - CLI entry point.

Find listing agents for property addresses by scraping public listing sites.

Usage:
    python -m agent_finder input.csv -o output.csv
    python -m agent_finder properties.xlsx -o results.xlsx --format excel
    python -m agent_finder input.csv -o output.csv --sources redfin,homeharvest
    python -m agent_finder input.csv --dry-run
"""

import argparse
import asyncio
import sys

from rich.console import Console
from rich.table import Table

from .input_handler import read_input, validate_input
from .output_handler import export_results, generate_summary
from .pipeline import AgentFinderPipeline

console = Console()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="agent_finder",
        description="Find listing agents for property addresses from public listing sites.",
    )
    parser.add_argument(
        "input",
        help="Path to input CSV or Excel file with property addresses",
    )
    parser.add_argument(
        "-o", "--output",
        default="output.csv",
        help="Path for output file (default: output.csv)",
    )
    parser.add_argument(
        "--format",
        choices=["csv", "excel"],
        default="csv",
        help="Output format (default: csv)",
    )
    parser.add_argument(
        "--sources",
        default="redfin,homeharvest,realtor",
        help="Comma-separated list of sources to use (default: redfin,homeharvest,realtor)",
    )
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=50,
        help="Max concurrent requests across all sources (default: 50)",
    )
    parser.add_argument(
        "--google-api-key",
        default="",
        help="Google Custom Search API key (enables google_search source)",
    )
    parser.add_argument(
        "--google-cse-id",
        default="",
        help="Google Custom Search Engine ID",
    )
    parser.add_argument(
        "--no-enrich",
        action="store_true",
        help="Skip contact enrichment step",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignore cached results and re-scrape everything",
    )
    parser.add_argument(
        "--cache-path",
        default="agent_finder_cache.db",
        help="Path to cache database (default: agent_finder_cache.db)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate input file and show preview without scraping",
    )

    return parser.parse_args()


def show_dry_run(input_path: str):
    """Validate and preview the input file."""
    console.print("[bold]Dry Run - Input Validation[/bold]\n")

    summary = validate_input(input_path)

    table = Table(title="Input File Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Total addresses", str(summary["total_rows"]))
    table.add_row("With city", str(summary["with_city"]))
    table.add_row("With state", str(summary["with_state"]))
    table.add_row("With ZIP", str(summary["with_zip"]))

    console.print(table)

    if summary["sample"]:
        console.print("\n[bold]Sample addresses (first 5):[/bold]")
        for i, addr in enumerate(summary["sample"], 1):
            console.print(f"  {i}. {addr}")

    console.print("\n[green]Input file looks valid![/green]")


async def async_main():
    args = parse_args()

    # Banner
    console.print("[bold cyan]Agent Finder[/bold cyan] - Listing Agent Lookup Tool\n")

    # Dry run mode
    if args.dry_run:
        show_dry_run(args.input)
        return

    # Read input
    console.print(f"Reading input from [bold]{args.input}[/bold]...")
    try:
        properties = read_input(args.input)
    except (FileNotFoundError, ValueError) as e:
        console.print(f"[red]Error:[/red] {e}")
        sys.exit(1)

    console.print(f"Found [bold]{len(properties)}[/bold] addresses to process.\n")

    if not properties:
        console.print("[yellow]No valid addresses found in input file.[/yellow]")
        sys.exit(0)

    # Parse sources
    sources = [s.strip() for s in args.sources.split(",")]

    # Build and run pipeline
    pipeline = AgentFinderPipeline(
        sources=sources,
        google_api_key=args.google_api_key,
        google_cse_id=args.google_cse_id,
        max_concurrent=args.max_concurrent,
        cache_path=args.cache_path if not args.no_cache else ":memory:",
        enrich=not args.no_enrich,
    )

    results = await pipeline.run(properties)

    # Export results
    output_path = export_results(results, args.output, args.format)
    console.print(f"\n[green]Results exported to:[/green] [bold]{output_path}[/bold]")

    # Show summary table
    summary = generate_summary(results)
    table = Table(title="Results Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Count", style="green", justify="right")

    table.add_row("Total addresses", str(summary["total"]))
    table.add_row("Found (complete)", str(summary["found"]))
    table.add_row("Found (partial)", str(summary["partial"]))
    table.add_row("From cache", str(summary["cached"]))
    table.add_row("Not found", str(summary["not_found"]))
    table.add_row("Errors", str(summary["errors"]))
    table.add_row("Success rate", summary["success_rate"])

    console.print()
    console.print(table)

    if summary["sources"]:
        console.print("\n[bold]Sources breakdown:[/bold]")
        for src, count in sorted(summary["sources"].items(), key=lambda x: -x[1]):
            console.print(f"  {src}: {count}")


def main():
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
