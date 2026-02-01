from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
data = {"temp": 0, "hum": 0}

@app.route("/")
def home():
    return render_template("index.html", data=data)

@app.route("/datos", methods=["POST"])
def recibir():
    global data
    data = request.get_json()
    return jsonify({"status":"ok"})
