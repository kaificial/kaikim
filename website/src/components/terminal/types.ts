export type LineKind = 'in' | 'out' | 'err' | 'ok';
export type Line = { kind: LineKind; text: string };

export type CommandContext = {
    /** the command word exactly as typed */
    cmd: string;
    /** everything after the command word, joined with single spaces */
    arg: string;
    args: string[];
    /** current route, e.g. "/projcts" on the 404 page */
    pathname: string;
    print: (text: string, kind?: LineKind) => void;
    clear: () => void;
    /** prints a take-off line, then goes to `path` */
    navigate: (path: string) => void;
    commands: Command[];
};

export type Command = {
    name: string;
    aliases?: string[];
    /** extra words tab completion can suggest (e.g. "dir" for ls) */
    complete?: string[];
    /** the line `help` shows. commands without one stay out of the list */
    help?: string;
    /** easter eggs: they run, but tab completion never suggests them */
    hidden?: boolean;
    /** tab completion for the first argument */
    completeArg?: (partial: string) => string[];
    run: (ctx: CommandContext) => void;
};

export type TerminalHandle = {
    run: (input: string) => void;
    print: (text: string, kind?: LineKind) => void;
    navigate: (path: string) => void;
};
