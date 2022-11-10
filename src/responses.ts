export class OkOrError {
    id: string;
    ok: boolean;
    message: string;
    
    constructor(ok: boolean, message: string, id: string) {
        this.ok = ok;
        this.message = message.toString();
        this.id = id;
    }

    static from(json: string): OkOrError {
        try {
            var object = JSON.parse(json);
            return new OkOrError(
                String(object.ok).toLowerCase().includes("true"), 
                object.message, 
                object.id);
        } catch (e) {
            console.error("Could not parse object as OkOrError: " + JSON.stringify(object));
            throw e;
        }
    }

    isOk(): boolean {
        return this.ok;
    }

    getMessage(): string {
        return this.message;
    }
}

/**
 * represents a single Path entry, which may be a file or directory
 */
export class PathEntry {
    public static readonly FILE = 0;
    public static readonly DIRECTORY = 1;

    path: string;
    kind: number;

    constructor(path: string, type: number) {
        this.path = path;
        this.kind = type;
    }

    /** parse the given string as a PathEntry */
    public static from(str: string): PathEntry {
        let obj = JSON.parse(str);
        if (obj.path === undefined) {
            throw new TypeError("string object could not be parsed as PathEntry: " + str);
        }
        if (obj.kind === undefined) {
            throw new TypeError("string object could not be parsed as PathEntry: " + str);
        }

        return new PathEntry(obj.path, obj.kind);
    }
}

/**
 * represents a list of paths
 */
export class PathList {
    list: PathEntry[];
    constructor(list: PathEntry[]) {
        this.list = list;
    }
    public static from(str: string) {
        let obj = JSON.parse(str);
        if (obj.list === undefined) {
            throw new TypeError("string could not be parsed as PathList: " + str);
        }

        return new PathList(obj.list);
    }
}

export class DirTree {
    name: string;
    dirs: DirTree[];
    files: string[];

    constructor(name: string) {
        this.dirs = [];
        this.files = [];
        this.name = name;
    }

    public static fromStr(str: string): DirTree {
        let obj = JSON.parse(str);
        return DirTree.from(obj);
    }

    public static from(obj: any): DirTree {
        let tree = new DirTree(obj.name);
        obj.dirs.forEach((element: DirTree) => {
            tree.dirs.push(DirTree.from(element));
        });
        tree.files = obj.files;
        return tree;
    }

    public toList(prefix: string): string[] {
        let retval: string[] = [];
        this.toListInner(prefix, retval);
        return retval;
    }

    private toListInner(root: string, list: string[]): string[] {
        this.files.forEach(file => list.push(root + "/" + file));
        this.dirs.forEach(dir => dir.toListInner(root + "/" + dir.name, list))
        return list;
    }

}