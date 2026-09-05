import OperationsBoardContent from "@/components/help/OperationsBoardContent";
import { Stack } from "expo-router";

export default function OperationsBoardHelpScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Operations Board", headerBackButtonDisplayMode: "minimal" }}
      />
      <OperationsBoardContent />
    </>
  );
}
