import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { ConversationMessage } from "../types/message";

type Props = {
  message: ConversationMessage;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.text, isUser && styles.userText]}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  userText: {
    color: colors.card
  }
});
