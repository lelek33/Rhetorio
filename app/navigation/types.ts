import { Analysis } from "../types/analysis";
import { CustomTraining } from "../types/customTraining";

export type AuthStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Training: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ScenarioDetail: { scenarioId: string };
  Session: { scenarioId?: string; customTraining?: CustomTraining };
  Analysis: { sessionId: string; analysis?: Analysis };
  Upgrade: undefined;
  CustomTraining: undefined;
};
