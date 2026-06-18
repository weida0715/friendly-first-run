"""CLI entrypoint to run background experiment worker."""

from __future__ import annotations

import logging

from app.workers import run_worker


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    run_worker()


if __name__ == "__main__":
    main()
