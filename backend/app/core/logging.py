import logging
import sys


def setup_logging() -> None:
    """
    Configures the application-wide logging formats and handlers.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
