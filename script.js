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

    function resetMachine() {
        rotor1Pos = parseInt(rotor1PosSelect.value);
        rotor2Pos = parseInt(rotor2PosSelect.value);
        rotor3Pos = parseInt(rotor3PosSelect.value);
        inputText.value = '';
        outputText.value = '';
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

    function processKeyPress(char) {
        // 1. 로터 회전
        rotateRotors();

        // 2. 암호화
        const encryptedChar = enigmaEncrypt(char);

        // 3. 화면 업데이트
        inputText.value += char;
        outputText.value += encryptedChar;

        // 램프 켜기
        lightLamp(encryptedChar);
    }
    
    function rotateRotors() {
        // 더블 스텝핑 로직 포함
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

    function enigmaEncrypt(char) {
        let charIndex = ALPHABET.indexOf(char);

        // 로터를 통과하는 경로 (오른쪽 -> 왼쪽)
        charIndex = passThroughRotor(charIndex, ROTORS['I'], rotor1Pos, false);
        charIndex = passThroughRotor(charIndex, ROTORS['II'], rotor2Pos, false);
        charIndex = passThroughRotor(charIndex, ROTORS['III'], rotor3Pos, false);

        // 반사판
        charIndex = ALPHABET.indexOf(REFLECTOR_B[charIndex]);

        // 로터를 통과하는 경로 (왼쪽 -> 오른쪽)
        charIndex = passThroughRotor(charIndex, ROTORS['III'], rotor3Pos, true);
        charIndex = passThroughRotor(charIndex, ROTORS['II'], rotor2Pos, true);
        charIndex = passThroughRotor(charIndex, ROTORS['I'], rotor1Pos, true);

        return ALPHABET[charIndex];
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

    function lightLamp(char) {
        const lamp = lampboardDiv.querySelector(`.key[data-key="${char}"]`);
        lamp.classList.add('lit');
        setTimeout(() => {
            lamp.classList.remove('lit');
        }, 300); // 0.3초 후에 램프 불 꺼짐
    }

    // 초기화
    resetMachine();
});