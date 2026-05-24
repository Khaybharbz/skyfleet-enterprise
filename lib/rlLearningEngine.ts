type State = string; // simplified encoding
type Action = string; // driverId

type Experience = {
  state: State;
  action: Action;
  reward: number;
  nextState: State;
};

/**
 * 🧠 Q-TABLE (memory of experience)
 */
const Q: Record<string, number> = {};

/**
 * 🔑 state-action key
 */
function key(state: State, action: Action) {
  return `${state}::${action}`;
}

/**
 * 🧠 Q-LEARNING UPDATE RULE
 */
export function updateQ(
  exp: Experience
) {
  const k = key(exp.state, exp.action);

  const old = Q[k] || 0;

  const alpha = 0.1; // learning rate
  const gamma = 0.9; // future reward weight

  const updated =
    old +
    alpha *
      (exp.reward + gamma * 0 - old);

  Q[k] = updated;
}

/**
 * 🧠 ACTION SELECTION (EXPLOITATION)
 */
export function chooseBestAction(
  state: State,
  actions: Action[]
) {
  let best = actions[0];
  let bestVal = -Infinity;

  for (const a of actions) {
    const val = Q[key(state, a)] || 0;

    if (val > bestVal) {
      bestVal = val;
      best = a;
    }
  }

  return best;
}