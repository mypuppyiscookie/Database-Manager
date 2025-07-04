document.addEventListener("DOMContentLoaded", function () {
    let isChecked = false;

    document.getElementById("check_btn").addEventListener("click", function () {
        const userId = document.getElementById('user_id').value;
        const resultSpan = document.getElementById('id_check_result');

        if (!userId) {
            alert("아이디를 입력해주세요.");
            return;
        }

        fetch(`../../controller/registerController.php?user_id=${encodeURIComponent(userId)}`)
        .then(response => response.text())
        .then(result => {
            if (result === "OK") {
                resultSpan.style.color = "green";
                resultSpan.innerText = "사용 가능한 아이디입니다.";
                isChecked = true;
            } else {
                resultSpan.style.color = "red";
                resultSpan.innerText = "이미 존재하는 아이디입니다.";
                isChecked = false;
            }
        });
    });

    document.querySelector("form").addEventListener("submit", function (e) {
        if (!isChecked) {
            e.preventDefault(); // 제출 막기
            alert("아이디 중복 확인을 먼저 해주세요.");
        }
    });
});
