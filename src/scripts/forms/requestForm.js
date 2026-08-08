const NOT_PROVIDED = "—";

export function initRequestForms() {
  const forms = document.querySelectorAll("[data-request-form]");
  if (!forms.length) return;

  forms.forEach((form) => {
    const interestInputs = [...form.querySelectorAll('input[name="interest"]')];
    const interestError = form.querySelector("[data-request-interests-error]");
    const fieldset = form.querySelector("[data-request-interests]");

    const clearInterestError = () => {
      if (interestError) interestError.textContent = "";
      fieldset?.classList.remove("is-invalid");
    };

    interestInputs.forEach((input) =>
      input.addEventListener("change", () => {
        if (interestInputs.some((box) => box.checked)) clearInterestError();
      })
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const status = form.querySelector("[data-request-status]");
      const email = form.dataset.contactEmail;

      // Safety net: the browser already validates the native fields before this
      // fires, but re-check so the checkbox group below is never reached with
      // an invalid name/email.
      if (!form.reportValidity()) return;

      const selected = interestInputs.filter((box) => box.checked).map((box) => box.value);

      if (!selected.length) {
        if (interestError) interestError.textContent = "Please select at least one option.";
        fieldset?.classList.add("is-invalid");
        interestInputs[0]?.focus();
        return;
      }

      clearInterestError();

      if (!email) {
        if (status) status.textContent = "The contact email has not been configured.";
        return;
      }

      const values = new FormData(form);
      const read = (key) => String(values.get(key) || "").trim();

      const name = read("name");
      const senderEmail = read("email");
      const phone = read("phone");
      const country = read("country");

      const subject = `Invitation request — ${name} — ${selected.join(", ")}`;

      const body = [
        "NEW INVITATION REQUEST — The Gala at KOKO",
        "",
        "INTERESTED IN",
        ...selected.map((choice) => `  • ${choice}`),
        "",
        "CONTACT DETAILS",
        `  Name:    ${name}`,
        `  Email:   ${senderEmail}`,
        `  Phone:   ${phone || NOT_PROVIDED}`,
        `  Country: ${country || NOT_PROVIDED}`,
        "",
      ].join("\n");

      if (status) {
        status.textContent =
          "Your email application is opening. Review the message there before sending.";
      }

      window.location.href = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    });
  });
}
