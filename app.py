from flask import Flask
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "Mi primera web en Internet 😎"

# Render usa gunicorn, así que NO usamos app.run()
