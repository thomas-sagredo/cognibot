# minimal_server.py
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Server is working"}

@app.get("/test")
def test():
    return {"status": "ok", "message": "Test endpoint working"}

if __name__ == "__main__":
    print("Starting minimal server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

