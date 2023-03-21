import { useTimeoutFn } from "@vueuse/core";
import { ref } from "vue";

const health = ref(100);
const numTreats = ref(0);
const recollieImage = ref(
  new URL("/src/assets/idle_happy.gif", import.meta.url).href
);

const takeDamage = (dmg: number) => {
  health.value -= dmg;
};

const eatTreat = (dmg: number) => {
  numTreats.value -= 1;
  health.value += dmg;
};

const addTreat = () => (numTreats.value += 1);

const getImage = (motionType?: number) => {
  let imageUrl = "/src/assets/";
  if (motionType) {
    switch (motionType) {
      case 0:
        if (health.value >= 75) {
          imageUrl += "detect_happy.gif";
        } else {
          imageUrl += "detect_sad.gif";
        }
        break;
      case 1:
        imageUrl += "eat.gif";
        break;
      case 2:
        imageUrl += "pet.gif";
        break;
      default:
        imageUrl += "detect_happy.gif";
        break;
    }
    const { isPending, start, stop } = useTimeoutFn(() => {
      getImage();
    }, 3000);
    start();
  } else {
    if (health.value >= 75) {
      imageUrl += "idle_happy.gif";
    } else if (health.value >= 25) {
      imageUrl += "idle_normal.gif";
    } else {
      imageUrl += "idle_sad.gif";
    }
  }
  recollieImage.value = new URL(imageUrl, import.meta.url).href;
};

export { health, takeDamage, eatTreat, addTreat, getImage, recollieImage };
