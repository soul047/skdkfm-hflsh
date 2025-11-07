document.addEventListener('DOMContentLoaded', () => {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 실제 에니그마 I 로터 배선
    const ROTORS = {
        'I':   { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
        'II':  { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
        'III': { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' }
    };
    const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

    const keyboardDiv = document.getElementById('keyboard');
    const lampboardDiv = document.getElementById('lampboard');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    
    let rotor1Pos = 0, rotor2Pos = 0, rotor3Pos = 0;
    const rotor1PosSelect = document.getElementById('rotor1-pos');
    const rotor2PosSelect = document.getElementById('rotor2-pos');
    const rotor3PosSelect = document.getElementById('rotor3-pos');

    // 시각화 패널 DOM 요소 (새로 추가)
    const vis = {
        input: document.getElementById('vis-input'),
        r1: document.getElementById('vis-r1'),
        r2: document.getElementById('vis-r2'),
        r3: document.getElementById('vis-r3'),
        ref: document.getElementById('vis-ref'),
        r3r: document.getElementById('vis-r3r'),
        r2r: document.getElementById('vis-r2r'),
        r1r: document.getElementById('vis-r1r'),
        output: document.getElementById('vis-output')
    };

    // 키보드 및 램프보드 생성
    const keyLayout = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
    let keyMap = {};

    keyLayout.forEach((row, rowIndex) => {
        row.split('').forEach(char => {
            keyMap[char] = { row: rowIndex };
            const keyElement = createKey(char);
            keyboardDiv.appendChild(keyElement);
            
            const lampElement = createKey(char);
            lampboardDiv.appendChild(lampElement);

            keyElement.addEventListener('click', () => processKeyPress(char));
        });
    });
    
    // 로터 설정 드롭다운 메뉴 초기화
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

    // 시각화 패널 초기화 함수 (새로 추가)
    function resetVisualization() {
        for (const key in vis) {
            vis[key].textContent = '-';
        }
    }

    function resetMachine() {
        rotor1Pos = parseInt(rotor1PosSelect.value);
        rotor2Pos = parseInt(rotor2PosSelect.value);
        rotor3Pos = parseInt(rotor3PosSelect.value);
        inputText.value = '';
        outputText.value = '';
        resetVisualization(); // 리셋 시 시각화 패널도 초기화
    }
    
    rotor1PosSelect.addEventListener('change', resetMachine);
    rotor2PosSelect.addEventListener('change', resetMachine);
    rotor3PosSelect.addEventListener('change', resetMachine);
    document.getElementById('reset-button').addEventListener('click', resetMachine);

    // 실제 키보드 입력 처리
    document.addEventListener('keydown', (e) => {
        const char = e.key.toUpperCase();
        if (ALPHABET.includes(char)) {
            processKeyPress(char);
        }
    });

    // 화면의 드롭다운 메뉴를 업데이트하는 함수
    function updateRotorDisplays() {
        rotor1PosSelect.value = rotor1Pos;
        rotor2PosSelect.value = rotor2Pos;
        rotor3PosSelect.value = rotor3Pos;
    }

    function processKeyPress(char) {
        // 1. 로터 회전 (암호화 전에 먼저 회전)
        rotateRotors();
        updateRotorDisplays(); // 회전된 로터 위치를 화면에 반영

        // 2. 암호화 및 시각화 데이터 가져오기 (수정됨)
        const { finalChar, path } = enigmaEncryptAndVisualize(char);

        // 3. 시각화 패널 업데이트 (새로 추가)
        updateVisualization(path);

        // 4. 화면 업데이트
        inputText.value += char;
        outputText.value += finalChar;

        // 5. 램프 켜기
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

    // 암호화와 동시에 경로를 추적하도록 함수 수정
    function enigmaEncryptAndVisualize(char) {
        const path = [];
        let charIndex = ALPHABET.indexOf(char);
        path.push(ALPHABET[charIndex]); // 0: Input

        // 로터를 통과하는 경로 (오른쪽 -> 왼쪽)
        charIndex = passThroughRotor(charIndex, ROTORS['I'], rotor1Pos, false);
        path.push(ALPHABET[charIndex]); // 1: Rotor I
        charIndex = passThroughRotor(charIndex, ROTORS['II'], rotor2Pos, false);
        path.push(ALPHABET[charIndex]); // 2: Rotor II
        charIndex = passThroughRotor(charIndex, ROTORS['III'], rotor3Pos, false);
        path.push(ALPHABET[charIndex]); // 3: Rotor III

        // 반사판
        charIndex = ALPHABET.indexOf(REFLECTOR_B[charIndex]);
        path.push(ALPHABET[charIndex]); // 4: Reflector

        // 로터를 통과하는 경로 (왼쪽 -> 오른쪽)
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

    // 시각화 패널 업데이트 함수 (새로 추가)
    function updateVisualization(path) {
        vis.input.textContent = path[0];
        vis.r1.textContent = path[1];
        vis.r2.textContent = path[2];
        vis.r3.textContent = path[3];
        vis.ref.textContent = path[4];
        vis.r3r.textContent = path[5];
        vis.r2r.textContent = path[6];
        vis.r1r.textContent = path[7];
        vis.output.textContent = path[8];
    }

    function lightLamp(char) {
        const lamp = lampboardDiv.querySelector(`.key[data-key="${char}"]`);
        lamp.classList.add('lit');
        setTimeout(() => {
            lamp.classList.remove('lit');
        }, 300); 
    }

    // 초기화
    resetMachine();
});