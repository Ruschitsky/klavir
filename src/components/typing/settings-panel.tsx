import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { dayKey } from "@/lib/typing/analysis";
import { COPY, type UiLang } from "@/lib/typing/i18n";
import { useKlavir } from "@/lib/typing/store";

function Row({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <p className="w-44 shrink-0 pt-1.5 text-sm text-muted">{label}</p>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">{children}</div>
        {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
      </div>
    </div>
  );
}

export function SettingsPanel({ ui, onCheck }: { ui: UiLang; onCheck: () => void }) {
  const copy = COPY[ui];
  const state = useKlavir();
  const { setSettings } = state;
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const download = async () => {
    const name = `klavir-${dayKey(Date.now())}.json`;
    // Inside the desktop app the web view cannot save downloads, so the app saves the file itself.
    const invoke = (window as unknown as { __TAURI__?: { core?: { invoke?: (cmd: string, args: unknown) => Promise<unknown> } } })
      .__TAURI__?.core?.invoke;
    if (invoke) {
      try {
        const path = await invoke("save_backup", { name, contents: state.exportData() });
        setNote(copy.savedTo.replace("{path}", String(path)));
      } catch {
        setNote(copy.importBad);
      }
      return;
    }
    const blob = new Blob([state.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      setNote(state.importData(await file.text()) ? copy.importOk : copy.importBad);
    } catch {
      setNote(copy.importBad);
    }
  };

  return (
    <section className="chrome stage flex flex-col gap-4" aria-label={copy.settings}>
      <Row label={copy.theme}>
        <Chip active={state.theme === "auto"} onClick={() => setSettings({ theme: "auto" })}>
          {copy.themeAuto}
        </Chip>
        <Chip active={state.theme === "dark"} onClick={() => setSettings({ theme: "dark" })}>
          {copy.themeDark}
        </Chip>
        <Chip active={state.theme === "light"} onClick={() => setSettings({ theme: "light" })}>
          {copy.themeLight}
        </Chip>
      </Row>
      <Row label={copy.textSize}>
        <Chip active={state.scale === 0} onClick={() => setSettings({ scale: 0 })}>
          {copy.sizeS}
        </Chip>
        <Chip active={state.scale === 1} onClick={() => setSettings({ scale: 1 })}>
          {copy.sizeM}
        </Chip>
        <Chip active={state.scale === 2} onClick={() => setSettings({ scale: 2 })}>
          {copy.sizeL}
        </Chip>
      </Row>
      <Row label={copy.errorMode} note={state.strict ? copy.strictNote : copy.freeNote}>
        <Chip active={state.strict} onClick={() => setSettings({ strict: true })}>
          {copy.strictLabel}
        </Chip>
        <Chip active={!state.strict} onClick={() => setSettings({ strict: false })}>
          {copy.freeLabel}
        </Chip>
      </Row>
      <Row label={copy.keyboardShow}>
        <Chip active={state.showKeys} onClick={() => setSettings({ showKeys: true })}>
          {copy.on}
        </Chip>
        <Chip active={!state.showKeys} onClick={() => setSettings({ showKeys: false })}>
          {copy.off}
        </Chip>
      </Row>
      <Row label={copy.fingerColors}>
        <Chip active={state.fingerColors} onClick={() => setSettings({ fingerColors: true })}>
          {copy.on}
        </Chip>
        <Chip active={!state.fingerColors} onClick={() => setSettings({ fingerColors: false })}>
          {copy.off}
        </Chip>
      </Row>
      <Row label={copy.fadeHints} note={copy.fadeNote}>
        <Chip active={state.fadeHints} onClick={() => setSettings({ fadeHints: true })}>
          {copy.on}
        </Chip>
        <Chip active={!state.fadeHints} onClick={() => setSettings({ fadeHints: false })}>
          {copy.off}
        </Chip>
      </Row>
      <Row label={copy.checkRetake}>
        <Button size="sm" variant="outline" onClick={onCheck}>
          {copy.checkStart}
        </Button>
      </Row>
      <Row label={copy.goal}>
        {[5, 10, 20, 30].map((min) => (
          <Chip key={min} active={state.goalMin === min} onClick={() => setSettings({ goalMin: min })}>
            {min} {copy.minShort}
          </Chip>
        ))}
      </Row>
      <Row label={copy.backup} note={note ?? copy.backupNote}>
        <Button size="sm" variant="outline" onClick={() => void download()}>
          {copy.exportFile}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
          {copy.importFile}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </Row>
    </section>
  );
}
