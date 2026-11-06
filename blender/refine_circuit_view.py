"""Compatibility entry point: rebuild the current scene, never restore stale scenery."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('build_circuit.py')),run_name='__main__')
