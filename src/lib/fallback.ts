// Predefined answers used when live AI is not connected.
const TOPICS: { keys: string[]; answer: string }[] = [
  {
    keys: ["electric", "bill", "power", "energy", "ac", "fan", "light", "fridge"],
    answer:
      "**Ways to cut your electricity bill:**\n- Set the AC to 24–26°C and clean filters monthly.\n- Switch to LED bulbs and 5-star rated appliances.\n- Unplug chargers, TVs and set-top boxes when not in use.\n- Run washing machines and geysers only with full loads / short timers.\n- Keep the fridge away from walls and don't overfill it.",
  },
  {
    keys: ["clean", "dust", "stain", "mop", "bathroom", "kitchen sink", "smell"],
    answer:
      "**Easy cleaning routine:**\n- Daily: wipe kitchen counters, sweep floors, empty bins.\n- Weekly: mop floors, clean bathrooms, change bedsheets.\n- Tip: vinegar + baking soda removes most sink and tile stains.\n- Tip: lemon water in the microwave for 2 minutes loosens grime.",
  },
  {
    keys: ["cook", "recipe", "rice", "egg", "potato", "onion", "tomato", "dal", "dinner", "lunch", "breakfast", "ingredient"],
    answer:
      "**Quick recipe ideas from common ingredients:**\n- Onion + tomato + potato → Aloo sabzi with roti.\n- Eggs + onion → Masala omelette or egg bhurji.\n- Rice + dal + spices → Simple khichdi.\n- Leftover rice + veggies → Vegetable fried rice.",
  },
  {
    keys: ["organi", "declutter", "room", "closet", "wardrobe", "chore", "storage", "messy"],
    answer:
      "**Organizing your home:**\n- Work one room (or one drawer) at a time.\n- Keep / Donate / Discard: sort everything into three piles.\n- Use labelled boxes and vertical storage.\n- Split chores on a weekly chart so every family member helps.",
  },
];

export const OFFLINE_DEFAULT =
  "I can help with **electricity saving, cleaning, cooking and home organization**. Try asking: *\"How can I reduce my AC bill?\"* or *\"What can I cook with eggs and onions?\"*";

export function fallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  const hit = TOPICS.find((t) => t.keys.some((k) => q.includes(k)));
  return hit ? hit.answer : OFFLINE_DEFAULT;
}
