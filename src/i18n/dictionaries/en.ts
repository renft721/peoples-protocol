// Textos en inglés. Es la referencia: el español tiene que tener exactamente las mismas claves.
export const en = {
  meta: {
    title: "People's Protocol",
    description:
      "A portable, verifiable record of what you've paid on time — checkable by anyone, without asking permission from whoever held it first.",
  },
  a11y: {
    skipToContent: "Skip to content",
    mainNav: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    changeLanguage: "Change language",
    home: "People's Protocol, home",
  },
  nav: {
    home: "Home",
    generate: "Generate proof",
    verify: "Verify",
    institutions: "For institutions",
    help: "Help",
  },
  network: {
    devnet: "Devnet",
    devnetTitle: "Pilot running on Solana's test network (devnet)",
  },
  language: {
    otherName: "Español",
  },
  home: {
    eyebrow: "For tenants, employees and freelancers",
    title: "What you've paid on time, finally provable.",
    lead: "Take your record with you to another city, another bank, another landlord. No documents that can be edited, no letters nobody can check.",
    ctaGenerate: "Generate my proof",
    ctaVerify: "Check a proof",
    steps: [
      { title: "You pay as usual", body: "It happens at your bank or in your invoicing system." },
      { title: "You generate the proof", body: "A guided login of under a minute, or your invoice's QR code." },
      { title: "It's recorded on Solana", body: "Linked to your wallet, not to your email or your ID." },
      { title: "Anyone you choose checks it", body: "With a link, without asking anyone's permission." },
    ],
  },
  placeholder: {
    underConstruction: "This screen is under construction.",
    backHome: "Back to home",
  },
  notFound: {
    title: "Page not found",
    body: "The address you opened doesn't exist.",
  },
};

export type Dictionary = typeof en;
