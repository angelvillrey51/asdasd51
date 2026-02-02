from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)

# variable global de orden
orden = False

@app.route("/")
def home():
    return render_template("index.html")

# La web manda la señal aquí
@app.route("/abrir", methods=["POST"])
def abrir():
    global orden
    orden = True
    return jsonify({"status": "ok"})

# El ESP32 consulta aquí
@app.route("/orden", methods=["GET"])
def get_orden():
    global orden
    if orden:
        orden = False
        return jsonify({"abrir": True})
    return jsonify({"abrir": False})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
