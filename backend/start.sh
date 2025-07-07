#!/bin/bash

# Install dependencies from requirements.txt with the extra index URL
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Start the FastAPI server with uvicorn
uvicorn server:app --host 0.0.0.0 --port $PORT