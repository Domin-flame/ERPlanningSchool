import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "../components/Badge.jsx";

describe("Badge", () => {
  it("affiche le texte du statut fourni", () => {
    render(<Badge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it.each([
    ["Active", "success"],
    ["Completed", "neutral"],
    ["Draft", "warning"],
    ["Overdue", "danger"],
    ["In Progress", "success"],
  ])("mappe le statut '%s' vers la classe CSS '%s'", (status, expectedClass) => {
    render(<Badge status={status} />);
    expect(screen.getByText(status)).toHaveClass(`badge ${expectedClass}`);
  });

  it("retombe sur 'neutral' pour un statut inconnu", () => {
    render(<Badge status="StatutInconnu" />);
    expect(screen.getByText("StatutInconnu")).toHaveClass("badge neutral");
  });
});
