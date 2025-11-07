document.addEventListener('DOMContentLoaded', () => {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 로터 배선
    const ROTORS = {
        'I':   { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
        'II':  { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
        'III': { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' }
    };
    const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

    // 기본 DOM 요소
    const keyboardDiv = document.getElementById('keyboard');
    const lampboardDiv = document.getElementById('lampboard');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    
    // 로터 설정
    let rotor1Pos = 0, rotor2Pos = 0, rotor3Pos = 0;
    const rotor1PosSelect = document.getElementById('rotor1-pos');
    const rotor2PosSelect = document.getElementById('rotor2-pos');
    const rotor3PosSelect = document.getElementById('rotor3-pos');

    // ▼▼▼ 새로 추가된 시각화 요소 ▼▼▼
    const tape1 = document.getElementById('rotor-tape-1');
    const tape2 = document.getElementById('rotor-tape-2');
    const tape3 = document.getElementById('rotor-tape-3');
    const LETTER_HEIGHT = 20; // CSS에서 설정한 글자 높이

    const vis = {
        input: document.getElementById('vis-input'),
        r1: document.getElementById('vis-r1'), r2: document.getElementById('vis-r2'), r3: document.getElementById('vis-r3'),
        ref: document.getElementById('vis-ref'),
        r3r: document.getElementById('vis-r3r'), r2r: document.getElementById('vis-r2r'), r1r: document.getElementById('vis-r1r'),
        output: document.getElementById('vis-output')
    };

    // 로터 테이프(Z-A-B-C...Z-A-B)를 생성하는 함수 (새로 추가)
    function populateRotorTapes() {
        [tape1, tape2, tape3].forEach(tape => {
            tape.innerHTML = ''; // 비우기
            // Z A B ... Y Z A (위아래로 여유분 추가)
            const letters = [ALPHABET[25], ...ALPHABET.split(''), ALPHABET[0]];
            letters.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                tape.appendChild(span);
            });
        });
    }

    // 키보드/램프보드 생성
    const keyLayout = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
    keyLayout.forEach(row => {
        row.split('').forEach(char => {
            const keyElement = createKey(char);
            keyboardDiv.appendChild(keyElement);
            const lampElement = createKey(char);
            lampboardDiv.appendChild(lampElement);
            keyElement.addEventListener('click', () => processKeyPress(char));
        });
    });
    
    // 로터 설정 드롭다운 초기화
    ALPHABET.split('').forEach((char, index) => {
        [rotor1PosSelect, rotor2PosSelect, rotor3PosSelect].forEach(select => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = char;
            select.appendChild(option);
        });
    });

    function createKey(char) {
        const key = document.createElement('div');
        key.classList.add('key');
        key.textContent = char;
        key.dataset.key = char;
        return key;
    }

    function resetVisualization() {
        for (const key in vis) { vis[key].textContent = '-'; }
    }

    function resetMachine() {
        // 1. <select>에서 설정값 읽어오기
        rotor1Pos = parseInt(rotor1PosSelect.value);
        rotor2Pos = parseInt(rotor2PosSelect.value);
        rotor3Pos = parseInt(rotor3PosSelect.value);
        
        // 2. 텍스트 창 비우기
        inputText.value = '';
        outputText.value = '';
        
        // 3. 시각화 패널 비우기
        resetVisualization();
        
        // 4. 로터 다이얼 위치 업데이트 (수정됨)
        updateRotorDisplays();
    }
    
    rotor1PosSelect.addEventListener('change', resetMachine);
    rotor2PosSelect.addEventListener('change', resetMachine);
    rotor3PosSelect.addEventListener('change', resetMachine);
    document.getElementById('reset-button').addEventListener('click', resetMachine);

    document.addEventListener('keydown', (e) => {
        const char = e.key.toUpperCase();
        if (ALPHABET.includes(char)) {
            processKeyPress(char);
        }
    });

    // 화면 표시를 업데이트하는 함수 (크게 수정됨)
    function updateRotorDisplays() {
        // 1. 드롭다운 메뉴 값 업데이트
        rotor1PosSelect.value = rotor1Pos;
        rotor2PosSelect.value = rotor2Pos;
        rotor3PosSelect.value = rotor3Pos;

        // 2. 시각적 다이얼(테이프) 위치 업데이트
        // (pos + 1) * LETTER_HEIGHT 만큼 위로 이동
        // 'A'(pos=0)일 때, 1 * 20 = 20px 이동 (테이프의 'A'가 중앙에 옴)
        // 'B'(pos=1)일 때, 2 * 20 = 40px 이동 (테이프의 'B'가 중앙에 옴)
        tape1.style.transform = `translateY(-${(rotor1Pos + 1) * LETTER_HEIGHT}px)`;
        tape2.style.transform = `translateY(-${(rotor2Pos + 1) * LETTER_HEIGHT}px)`;
        tape3.style.transform = `translateY(-${(rotor3Pos + 1) * LETTER_HEIGHT}px)`;
    }

    function processKeyPress(char) {
        rotateRotors();
        updateRotorDisplays(); // 회전 결과를 시각화에 바로 반영

        const { finalChar, path } = enigmaEncryptAndVisualize(char);

        updateVisualization(path);
        inputText.value += char;
        outputText.value += finalChar;
        lightLamp(finalChar);
    }
    
    function rotateRotors() {
        const rotorI = ROTORS['I'];
        const rotorII = ROTORS['II'];

        if (ALPHABET[rotor2Pos] === rotorII.notch) {
            rotor2Pos = (rotor2Pos + 1) % 26;
            rotor3Pos = (rotor3Pos + 1) % 26;
        }
        if (ALPHABET[rotor1Pos] === rotorI.notch) {
            rotor2Pos = (rotor2Pos + 1) % 26;
        }
        rotor1Pos = (rotor1Pos + 1) % 26;
    }

    function enigmaEncryptAndVisualize(char) {
        const path = [];
        let charIndex = ALPHABET.indexOf(char);
        path.push(ALPHABET[charIndex]); // 0: Input

        charIndex = passThroughRotor(charIndex, ROTORS['I'], rotor1Pos, false);
        path.push(ALPHABET[charIndex]); // 1: Rotor I
        charIndex = passThroughRotor(charIndex, ROTORS['II'], rotor2Pos, false);
        path.push(ALPHABET[charIndex]); // 2: Rotor II
        charIndex = passThroughRotor(charIndex, ROTORS['III'], rotor3Pos, false);
        path.push(ALPHABET[charIndex]); // 3: Rotor III

        charIndex = ALPHABET.indexOf(REFLECTOR_B[charIndex]);
        path.push(ALPHABET[charIndex]); // 4: Reflector

        charIndex = passThroughRotor(charIndex, ROTORS['III'], rotor3Pos, true);
        path.push(ALPHABET[charIndex]); // 5: Rotor III (R)
        charIndex = passThroughRotor(charIndex, ROTORS['II'], rotor2Pos, true);
        path.push(ALPHABET[charIndex]); // 6: Rotor II (R)
        charIndex = passThroughRotor(charIndex, ROTORS['I'], rotor1Pos, true);
        path.push(ALPHABET[charIndex]); // 7: Rotor I (R)

        const finalChar = ALPHABET[charIndex];
        path.push(finalChar); // 8: Output
        
        return { finalChar, path };
    }
    
    function passThroughRotor(charIndex, rotor, offset, isReverse) {
        const entryIndex = (charIndex + offset) % 26;
        let exitChar;
        if (!isReverse) {
            exitChar = rotor.wiring[entryIndex];
        } else {
            exitChar = ALPHABET[rotor.wiring.indexOf(ALPHABET[entryIndex])];
        }
        let exitIndex = ALPHABET.indexOf(exitChar);
        return (exitIndex - offset + 26) % 26;
    }

    function updateVisualization(path) {
        vis.input.textContent = path[0];
        vis.r1.textContent = path[1]; vis.r2.textContent = path[2]; vis.r3.textContent = path[3];
        vis.ref.textContent = path[4];
        vis.r3r.textContent = path[5]; vis.r2r.textContent = path[6]; vis.r1r.textContent = path[7];
        vis.output.textContent = path[8];
    }

    function lightLamp(char) {
        const lamp = lampboardDiv.querySelector(`.key[data-key="${char}"]`);
        lamp.classList.add('lit');
        setTimeout(() => {
            lamp.classList.remove('lit');
        }, 300); 
    }

    // --- 앱 시작 시 실행 ---
    populateRotorTapes(); // 로터 다이얼(테이프) 생성
    resetMachine(); // 기계 초기화
});