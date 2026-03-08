from fastapi import FastAPI

app = FastAPI(title="code2cloud API")

@app.get("/")
async def root():
    return {"message": "Welcome to code2cloud API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
