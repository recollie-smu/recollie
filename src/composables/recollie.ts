import { useTimeoutFn } from "@vueuse/core";
import { ref } from "vue";

const health = ref(100);
const numTreats = ref(0);
const idleHappyImg = new URL("/src/assets/idle_happy.gif", import.meta.url)
  .href;
const idleNormalImg = new URL("/src/assets/idle_normal.gif", import.meta.url)
  .href;
const idleSadImg = new URL("/src/assets/idle_sad.gif", import.meta.url).href;

const detectHappyImg = new URL("/src/assets/detect_happy.gif", import.meta.url)
  .href;
const detectSadImg = new URL("/src/assets/detect_sad.gif", import.meta.url)
  .href;

const eatImg = new URL("/src/assets/eat.gif", import.meta.url).href;
const petImg = new URL("/src/assets/pet.gif", import.meta.url).href;

const recollieImage = ref(idleHappyImg);

const takeDamage = (dmg: number) => {
  health.value -= dmg;
};

const eatTreat = (dmg: number) => {
  numTreats.value -= 1;
  health.value += dmg;
  getImage(2);
};

const addTreat = () => (numTreats.value += 1);

const getImage = (motionType?: number) => {
  let imageUrl = "";
  if (motionType) {
    switch (motionType) {
      case 1:
        if (health.value >= 75) {
          imageUrl += detectHappyImg;
        } else {
          imageUrl += detectSadImg;
        }
        break;
      case 2:
        imageUrl += eatImg;
        break;
      case 3: {
        imageUrl += petImg;
        break;
      }
      default:
        imageUrl += detectHappyImg;
        break;
    }
    const { isPending, start, stop } = useTimeoutFn(() => {
      getImage();
    }, 3000);
    start();
  } else {
    if (health.value >= 75) {
      imageUrl += idleHappyImg;
    } else if (health.value >= 25) {
      imageUrl += idleNormalImg;
    } else {
      imageUrl += idleSadImg;
    }
  }
  recollieImage.value = imageUrl;
};

export {
  health,
  numTreats,
  takeDamage,
  eatTreat,
  addTreat,
  getImage,
  recollieImage,
};
