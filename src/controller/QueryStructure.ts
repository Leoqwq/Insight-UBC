export interface Transformation {
    GROUP: string[];
    APPLY: Array<{[key: string]: {[key: string]: string}}>;
}
export interface Query {
    WHERE: Where;
    OPTIONS: Option;
    TRANSFORMATIONS?: Transformation;
}

export interface Where {
    OR?: Where[];
    AND?: Where[];
    NOT?: Where;
    GT?: object;
    LT?: object;
    EQ?: object;
    IS?: object;
}

export interface Option {
    COLUMNS: string[];
    ORDER?: string | CompoundOrder;
}

export interface CompoundOrder {
    dir: string;
    keys: string[];
}
