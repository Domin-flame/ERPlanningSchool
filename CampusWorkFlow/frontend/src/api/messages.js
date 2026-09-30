import http, { asList, unwrap } from "./http.js";

const PAGE = 100;

export const messagesApi = {
  conversations: () =>
    unwrap(http.get("/messages/conversations/", { params: { limit: 100 } })).then(asList),
  /** payload: { name, participant_ids: number[], is_group?, role? } */
  createConversation: (payload) => unwrap(http.post("/messages/conversations/", payload)),
  /** Retourne les 100 messages les plus récents (le service trie par date croissante). */
  async messages(conversationId) {
    const url = `/messages/messages/conversation/${conversationId}`;
    const first = await unwrap(http.get(url, { params: { limit: PAGE } }));
    if ((first?.total ?? 0) <= PAGE) return asList(first);
    const last = await unwrap(http.get(url, { params: { skip: first.total - PAGE, limit: PAGE } }));
    return asList(last);
  },
  send: (conversationId, content) =>
    unwrap(http.post("/messages/messages/", { conversation_id: conversationId, content })),
  edit: (messageId, content) => unwrap(http.patch(`/messages/messages/${messageId}`, { content })),
  remove: (messageId) => unwrap(http.delete(`/messages/messages/${messageId}`)),
};
