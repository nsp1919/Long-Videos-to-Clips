
# Try to print emoji BEFORE import (should fail if not fixed globally, but we can't easily test 'before' in same script if we rely on import side effects)
# Actually, let's just import main, then print.

print("Importing main to trigger fix...")
try:
    import main
    print("Main imported.")
except Exception as e:
    # It might fail to run the app if uvicorn starts, but main.py has `if __name__ == "__main__":` so it should be safe to import.
    print(f"Import failed (might be expected if dependencies missing, but shouldn't happen here): {e}")

print("Testing emoji print: 🧪 Success!")
