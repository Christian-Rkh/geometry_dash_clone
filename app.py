import os
import random
import requests

from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

rankings = []
@app.route('/')
def home():
    return render_template('index.html')

@app.route("/api/level/1")
def api_level_1():

    data = {
        "speed": 500,
        "groundY": 540 - 350,
        "obstacles": [600, 900, 1200, 1500, 1800, 2100]
    }
    return jsonify(data)

@app.route("/api/score", methods=["POST"])
def api_score():
    data = request.get_json()
    name = data.get("name", "Anonymous")
    tries = int(data.get("tries", 0))
    time = float(data.get("time", 0))
    score = max(0, 1000 - tries * 10)

    jumps = int(data.get("jumps", 0))

    score = max(0, 1000 - (tries * 10 + time * 2 + jumps * 1))

    rankings.append({

        "name": name,
        "score": score,
        "tries": tries,
        "time": time,
        "jumps": jumps
    })

    rankings.sort(key=lambda x: x["score"], reverse=True)
    rankings[:] = rankings[:10]

    return jsonify({
        "message": "Score recorded!",
        "name": name,
        "score": score,
        "tries": tries,
        "time": time,
        "jumps": jumps
    })
@app.route("/api/rankings")
def api_rankings():
    return jsonify(rankings)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))  # Render가 주는 PORT 사용
    app.run(host="0.0.0.0", port=port, debug=False)