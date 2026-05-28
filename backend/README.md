# For run the application
```bash
./venv/bin/uvicorn main:app --reload
```

# For create the virtual environment (Only first time) and run the application
```bash
python3 -m venv venv
pip install -r requirements.txt
uvicorn main:app --reload
```

# For install the dependencies
```bash
./venv/bin/pip install -r requirements.txt
```

# Backend templates handling folder Structure
code2cloud-backend/
│
├── templates/
│   ├── docker/
│   │   ├── express.jinja
│   │   ├── springboot.jinja
│   │   └── fastapi.jinja
│   │
│   └── terraform/
│       ├── aws/
│       │   ├── providers.jinja
│       │   ├── variables.jinja
│       │   ├── main.jinja
│       │   └── outputs.jinja
│       │
│       ├── gcp/
│       │   ├── providers.jinja
│       │   ├── variables.jinja
│       │   └── main.jinja
│       │
│       └── azure/
│           ├── main.jinja
