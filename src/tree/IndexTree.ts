import { zip, takeWhile } from "../utils/itertools"

export const TreeRel = {    
    same: 0,
    ancestor: 1,
    decendants: 2,
    greater: 3,
    less: 4
} as const

export type TreeRelType = (typeof TreeRel)[keyof typeof TreeRel]

export function genHierachicalComparator<T,Obj>(comp:(lval:T,rval:T)=>number, conv:(obj:Obj)=>Array<T>):(lobj:Obj,robj:Obj)=>TreeRelType {

    return function (lobj:Obj, robj:Obj):TreeRelType {
        const lary = conv(lobj)
        const rary = conv(robj)
    
        const cary = Array.from(takeWhile(zip(lary, rary), (lr)=>comp(...lr) === 0))       

        if ((cary.length === lary.length) && (cary.length == rary.length)) {
            return TreeRel.same
        }
        else if (cary.length === lary.length) {
            return TreeRel.decendants
        }
        else if (cary.length === rary.length) {
            return TreeRel.ancestor
        }
        else if (comp(lary[cary.length], rary[cary.length]) > 0) {
            return TreeRel.less
        }
        else if (comp(lary[cary.length], rary[cary.length]) < 0) {
            return TreeRel.greater
        }
        else {
            throw new Error('Fatal error')
        }
    }
}

export type IndexTreeType<T> = ReturnType<typeof createIndexTree<T>>

export function createIndexTree<T>(comp:(right:T,left:T)=>TreeRelType) {

    return class Node {
        private parent: Node
        private _children: Node[]        
        private _value: T

        constructor(value: T, parent: Node | undefined = undefined, children: Node[] = []) {
            this.parent = parent || this
            this._children = children
            this._value = value
        }

        get isRoot(): boolean {
            return this == this.parent
        }

        get value(): T {
            return this._value
        }

        get children(): Node[] {
            return this._children
        }

        add(value: T): Node {            
            const rel = comp(this._value, value)
            if ((rel === TreeRel.decendants) || this.isRoot) {
                for (const idx of this._children.keys()) {                    
                    const childRel = comp(this._children[idx]._value, value)
                    if (childRel === TreeRel.ancestor) {                        
                        this._children[idx] = new Node(value, this, [ this._children[idx] ])                        
                        return this._children[idx]
                    }
                    else if ((childRel === TreeRel.decendants) || (childRel === TreeRel.same)) {
                        return this._children[idx].add(value)
                    }
                    else if (childRel === TreeRel.less) {
                        this._children.splice(idx, 0, new Node(value, this))
                        return this._children[idx]
                    }
                }   
                const newNode = new Node(value, this)
                this._children.push(newNode)
                return newNode           
            }
            else if ((rel === TreeRel.ancestor) || (rel === TreeRel.less) || (rel == TreeRel.greater)) {
                return this.parent.add(value)
            }
            else if (rel === TreeRel.same) {
                this._value = value
                return this
            }            
            else {
                throw new Error('Fatal error')
            }
        }

        *walkThrough(skipRoot:boolean = true):Generator<Node, void, unknown> {
            if (!skipRoot || !this.isRoot) {
                yield this
            }
            for (const child of this._children) {
                yield* child.walkThrough(false)
            }            
        }
    }

}