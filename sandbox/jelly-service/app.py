from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/jelly/status")
def status():
    return jsonify({"status": "ok", "energy": 42}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
