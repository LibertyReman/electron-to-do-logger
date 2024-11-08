let flatPickr;
let countdown;
let initTime;
let startDateTime;
let remainingTime;
let remainingAngle;
const $logBtn = document.querySelector('.js-log-btn');
const $startStopBtn = document.querySelector('.js-start-stop-btn');
const $saveResetBtn = document.querySelector('.js-save-reset-btn');
const $timerCircle = document.querySelector('.js-timer-circle');
const $timerDuration = document.querySelector('.js-timer-duration');
const $timerTitle = document.querySelector('.js-timer-title');
const $audio = document.querySelector('.js-audio');
const $modal = document.querySelector('.js-modal');
const $modalMessage = document.querySelector('.js-modal-message');
const $modalContinueBtn = document.querySelector('.js-modal-continue-btn');
const $modalCloseBtn = document.querySelector('.js-modal-close-btn');


// DOM読み込み完了後
window.addEventListener('DOMContentLoaded', () => {
  // ローカルストレージの値を表示
  const lastTime = localStorage.getItem('lastTime');
  if(lastTime) $timerDuration.value = lastTime;
  $timerTitle.value = localStorage.getItem('lastTitle');

  // 初期化処理
  initTime = timeToSecond($timerDuration.value);
  initializeFromQuery();
  initFlatpickr();
  timerState('INIT');

  // ログボタン押下
  $logBtn.onclick = () => {
    window.timer.openLogWindow();
  };

  // START・STOPボタン押下
  $startStopBtn.onclick = () => {
    if($startStopBtn.textContent === 'START') {
      timerState('START');
    }
    else {
      timerState('STOP');
    }
  };

  // SAVE・RESETボタン押下
  $saveResetBtn.onclick = () => {
    if($saveResetBtn.textContent === 'SAVE') {
      timerState('SAVE');
    } else {
      timerState('INIT');
    }
  };

  // タイマー設定押下
  $timerDuration.onclick = () => {
    flatPickr.toggle();
  };

  // エンター押下でタイマータイトルのフォーカスを外す
  $timerTitle.onkeydown = (event) => {
    if (event.key === 'Enter') {
      $timerTitle.blur();
    }
  };

  // タイマータイトルのフォーカスが外れたとき
  $timerTitle.onblur = () => {
    localStorage.setItem('lastTitle', $timerTitle.value);
    timerState('INIT');
  };

  // モーダルコンティニューボタン押下
  $modalContinueBtn.onclick = () => {
    stopAudio();
    closeModal();
    timerState('SAVE');
    timerState('START');
  };

  // モーダルクローズボタン押下
  $modalCloseBtn.onclick = () => {
    stopAudio();
    closeModal()
    timerState('SAVE');
  };
});

// クエリパラメータによる初期化
function initializeFromQuery() {
  // クエリパラメータの取得
  const urlParams = new URLSearchParams(window.location.search);
  const data = urlParams.get('data');
  const appSettings = JSON.parse(decodeURIComponent(data));

  setAudio(appSettings.sound, appSettings.volume);
}

function timeToSecond(time) {
  const [h, m, s] = time.split(':').map(Number);
  return 3600 * h + 60 * m + s;
}

function secondToHour(second) {
  const hour = second / 3600;
  return hour.toFixed(2);
}

function initFlatpickr() {
  flatPickr = flatpickr('#flatpickr', {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i:S',
    time_24hr: true,
    clickOpens: false,
    onClose: () => {
      localStorage.setItem('lastTime', $timerDuration.value);
      initTime = timeToSecond($timerDuration.value);
      timerState('INIT');
    },
  });
}

function timerState(state) {
  switch(state) {
    case 'INIT':
      clearInterval(countdown);
      startDateTime = null;
      remainingTime = initTime;
      remainingAngle = 360;
      updateTimerUI(remainingAngle, remainingTime, false);
      $timerTitle.disabled = false;

      // タイトル未設定の場合はSTARTボタン非表示
      if($timerTitle.value === '') {
        updateBtnUI('START', true, 'SAVE', true);
      } else {
        updateBtnUI('START', false, 'SAVE', true);
      }
      break;

    case 'START':
      // タイマー開始時の日時を取得
      if(startDateTime === null) {
        startDateTime = new Date().toLocaleString('ja-JP', {
          weekday: 'short',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      $timerTitle.disabled = true;
      updateTimerUI(remainingAngle, remainingTime, true);
      updateBtnUI('STOP', false, 'RESET', false);

      // タイマー起動
      countdown = setInterval(() => {
        remainingTime--;
        remainingAngle -= 360 / initTime;
        updateTimerUI(remainingAngle, remainingTime, true);

        if(remainingTime <= 0) {
          clearInterval(countdown);
          playAudio();
          openModal();
        }
      }, 1000);
      break;

    case 'STOP':
      clearInterval(countdown);
      $timerTitle.disabled = false;
      updateBtnUI('START', false, 'SAVE', false);
      break;

    case 'SAVE':
      // ログ保存
      const log = `[${startDateTime}] ${secondToHour(initTime - remainingTime)}h ${$timerTitle.value}\n`;
      window.timer.saveLog(log);

      timerState('INIT');
      break;

    default:
      alert('undefined state');
      break;
  }
}

function updateTimerUI(angle, time, timeDisabled) {
  const h = String(Math.floor(time / 3600)).padStart(2, '0');
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
  const s = String(time % 60).padStart(2, '0');

  $timerDuration.value = `${h}:${m}:${s}`;
  $timerDuration.disabled = timeDisabled;
  $timerCircle.style.backgroundImage = `conic-gradient(#F2A33C ${angle}deg, #565656 ${angle}deg)`;
}

function updateBtnUI(startStopText, startStopDisabled, saveResetText, saveResetDisabled) {
  $startStopBtn.textContent = startStopText;
  $startStopBtn.classList.toggle('u-bgcolor-red', startStopText === 'STOP');
  $startStopBtn.disabled = startStopDisabled;
  $saveResetBtn.textContent = saveResetText;
  $saveResetBtn.disabled = saveResetDisabled;
}

function setAudio(sound, volume) {
  if (sound === 'pipipi') {
    $audio.src = './audio/pipipi.mp3';
  } else {
    $audio.src = './audio/poppo.mp3';
  }

  $audio.volume = volume;
}

async function playAudio() {
  $audio.play();
}

async function stopAudio() {
  $audio.pause();
  $audio.currentTime = 0;
}

function openModal() {
  $modalMessage.innerHTML = `"${$timerTitle.value}"<br>${secondToHour(initTime - remainingTime)}h 終了`;
  $modal.classList.add('is-open');
}

function closeModal() {
  $modal.classList.remove('is-open');
}


