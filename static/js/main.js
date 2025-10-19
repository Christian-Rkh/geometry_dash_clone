let cursors, groundY, speedX = 300;

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    backgroundColor: "#0f1226",
    parent: "game-container",
    physics: {
        default: "arcade",
        arcade: {gravity: {y: 1000}, debug: false}
    },
    scene: {preload, create, update}
};

window.addEventListener("DOMContentLoaded", () => {
    new Phaser.Game(config);
    loadRankings();
    });


function preload() {
}


function create() {
    groundY = 540 - 80;

    this.jumpCount = 0;

    // ✅ 월드 전체 범위 지정 (물리 + 카메라 동일)
    const worldWidth = 9600;
    this.physics.world.setBounds(0, 0, worldWidth, 540);
    this.cameras.main.setBounds(0, 0, worldWidth, 540);

    // 바닥
    const ground = this.add.rectangle(0, groundY, worldWidth, 40, 0x1b2049).setOrigin(0, 0);
    this.physics.add.existing(ground, true);

    // 플레이어
    this.player = this.add.rectangle(120, groundY - 40, 32, 32, 0xffe066);
    this.physics.add.existing(this.player);
    // ✅ 월드 전체 범위를 따르도록 설정
    this.player.body.setCollideWorldBounds(true);

    // ✅ 카메라 추적
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 장애물 그룹
    this.spikes = this.physics.add.staticGroup();
    const spikeXs = [];
    for (let x = 600; x <= 9000; x += Phaser.Math.Between(400, 800)) {
        spikeXs.push(x);
    }
    for (let i = 0; i < spikeXs.length; i++) {
        const spike = this.add.rectangle(spikeXs[i], groundY - 36, 28, 36, 0xff5d73).setOrigin(0.5, 0);
        this.physics.add.existing(spike, true);
        this.spikes.add(spike);
    }

    // 충돌
    this.physics.add.collider(this.player, ground);

    // 오버랩 → 리셋
    this.physics.add.overlap(this.player, this.spikes, () => {
        this.player.x = 120;
        this.player.y = groundY - 40;
        this.player.body.setVelocity(0, 0);
        document.getElementById("progress").style.width = "0%";

        const triesEl = document.getElementById("tries");
        const n = parseInt(triesEl.textContent.replace(/\D/g, ''), 10) || 0;
        triesEl.textContent = `Tries: ${n + 1}`;
    });


    // 입력
    cursors = this.input.keyboard.createCursorKeys();


    // HUD
    document.getElementById("speed").textContent = `Speed: ${speedX} px/s`;
    document.getElementById("bpm").textContent = "BPM: -";


    const saveBtn = document.getElementById("saveBtn");
    const nameInput = document.getElementById("playerName");

    if (!saveBtn || !nameInput) return;

    saveBtn.disabled = false;

    saveBtn.addEventListener("click", async () => {
        const name=nameInput.value.trim() || "Guest";

        const triesEl = document.getElementById("tries");
        const tries = parseInt(triesEl.textContent.replace(/\D/g, ''), 10) || 0;

        const timeTaken = 0;


        try{
            const res = await fetch("/api/score", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                                name: name,
                                tries: tries,
                                time: timeTaken,
                                jump: this.jumpCount
                                })
            })

            const data = await res.json()
            console.log("/api/score", data);

            alert(`${data.name}님 점수: ${data.score}점 (${data.tries}번 시도, ${data.time}초 소요, 점프 ${data.jumps})`);
        }catch(err){
            console.error("점수 전송 실패:", err);
            alert("점수 저장에 실패했습니다.");
            return;
        }

        await loadRankings();

        alert(`${name}님의 랭킹이 업데이트 되었습니다.`)
    });

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadRankings);
        }
}



async function loadRankings(){
try {
    const res = await fetch("/api/rankings");
    const data = await res.json();

    console.log("loadRankings", data);

    const table = document.querySelector("#rankBody");
    if (!table) return;

    table.innerHTML = "";
    data.forEach((r, i) => {
        const tr = document.createElement("tr");

        console.log("r",r);
        console.log("r",r);

        tr.innerHTML =`
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
        <td>${r.tries}</td>
        <td>${r.time}</td>
        `;

        console.log("tr", tr)

        table.appendChild(tr);
    });
    } catch (err) {
            console.error("랭킹 로드 실패:", err);
    }
}




function update(time, delta) {
    const player = this.player;
    if (!player) return; // 안전장치

    // 오른쪽 자동 이동
    player.body.setVelocityX(speedX);

    // 점프
    if (cursors.space?.isDown && player.body.blocked.down) {
        player.body.setVelocityY(-450);
        this.jumpCount++
    }

    // 진행률
    const endX = 9600;
    const p = Math.max(0, Math.min(1, player.x / endX));
    document.getElementById("progress").style.width = (p * 100).toFixed(1) + "%";


    // Game Complete
    if (player.x >= endX -40) {
        alert("Game Complete!");
        this.scene.pause();
    }
    // HUD 갱신
    document.getElementById("speed").textContent = `Speed: ${speedX} px/s`;
}