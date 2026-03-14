import { costPerMillionToken, SupportedModel } from "../constants/openai-costs";

const calculateCost = ({
  model,
  inputTokenCount = 0,
  outputTokenCount = 0,
  imageCount = 0,
}: {
  model: string;
  inputTokenCount?: number;
  outputTokenCount?: number;
  imageCount?: number;
}): number => {
  const costPerOneToken = (perMillion: number) => perMillion / 1000000;

  const modelKey = model as SupportedModel;
  const costs = costPerMillionToken[modelKey];

  if (!costs) return 0;

  let totalCost = 0;

  if (inputTokenCount > 0) {
    totalCost += costPerOneToken(costs.input) * inputTokenCount;
  }

  if (outputTokenCount > 0) {
    totalCost += costPerOneToken(costs.output) * outputTokenCount;
  }

  if (imageCount > 0 && "perImage" in costs) {
    totalCost += costs.perImage * imageCount;
  }

  return parseFloat(totalCost.toFixed(6));
};

export { calculateCost };
