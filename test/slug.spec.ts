import { describe, it, expect } from "vitest";
import { slugify } from "../shared/slug";

describe("slugify", () => {
	it("transliterates æøå and lowercases", () => {
		expect(slugify("Sportsbil 1286 deler")).toBe("sportsbil-1286-deler");
		expect(slugify("Romstasjon m/ solcellepaneler")).toBe("romstasjon-m-solcellepaneler");
		expect(slugify("Åpen bro, Østre tårn, Ærlig pris")).toBe("apen-bro-ostre-tarn-aerlig-pris");
	});

	it("collapses whitespace and strips disallowed characters", () => {
		expect(slugify("  Dobbel   mellomrom  ")).toBe("dobbel-mellomrom");
		expect(slugify("100% Lego-kompatibel!")).toBe("100-lego-kompatibel");
	});
});
