#!/bin/bash

# Install dependencies from requirements.txt
pip install -r requirements.txt

# Start the FastAPI server with uvicorn
uvicorn server:app --host 0.0.0.0 --port $PORT