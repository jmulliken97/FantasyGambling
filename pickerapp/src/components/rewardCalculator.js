export const calculateReward = (price, riskAmount) => {
    let reward = 0;
    if (price < 0) {
      reward = (riskAmount * 100) / Math.abs(price);
    } else {
      reward = (riskAmount * price) / 100;
    }
    return reward;
  };