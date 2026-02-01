from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

ultimo = {"temp": 0, "hum": 0}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/datos", methods=["POST"])
def recibir():
    global ultimo
    ultimo = request.get_json()
    return "ok"

@app.route("/ver")
def ver():
    return jsonify(ultimo)
