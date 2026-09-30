import MockAdapter from "axios-mock-adapter";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http } from "../api/client.js";
import Chatbot from "../pages/ai/Chatbot.jsx";

let mock;

beforeEach(() => {
  mock = new MockAdapter(http);
});

afterEach(() => {
  mock.restore();
});

function renderChatbot() {
  return render(
    <MemoryRouter>
      <Chatbot />
    </MemoryRouter>
  );
}

function ask(question) {
  fireEvent.change(screen.getByLabelText("Votre question"), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer la question" }));
}

describe("Chatbot (/chatbot)", () => {
  it("envoie la question à /chatbot/message et affiche la réponse", async () => {
    mock.onPost("/chatbot/message").reply(200, { reply: "Consultez le Calendrier." });
    renderChatbot();

    ask("Où est mon emploi du temps ?");

    expect(await screen.findByText("Consultez le Calendrier.")).toBeInTheDocument();
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ message: "Où est mon emploi du temps ?", history: [] });

    mock.onPost("/chatbot/message").reply(200, { reply: "Dans le menu." });
    ask("Et les notes ?");
    expect(await screen.findByText("Dans le menu.")).toBeInTheDocument();
    expect(JSON.parse(mock.history.post[1].data).history).toEqual([
      { role: "user", content: "Où est mon emploi du temps ?" },
      { role: "assistant", content: "Consultez le Calendrier." },
    ]);
  });

  it("affiche l'erreur du service et restaure la question", async () => {
    mock.onPost("/chatbot/message").reply(503, { detail: "Le chatbot IA n'est pas configuré." });
    renderChatbot();

    ask("Bonjour");

    expect(await screen.findByRole("alert")).toHaveTextContent("Le chatbot IA n'est pas configuré.");
    expect(screen.getByLabelText("Votre question")).toHaveValue("Bonjour");
  });

  it("propose un lien vers l'Assistant IA", () => {
    renderChatbot();
    expect(screen.getByRole("link", { name: /Assistant IA/ })).toHaveAttribute("href", "/assistant");
  });
});
