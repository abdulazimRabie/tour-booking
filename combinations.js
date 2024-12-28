const combinations = (elements) => {
    if (elements.length === 1) return [ [elements[0]] ];
    const firstEle = elements[0];
    const rest = elements.slice(1);

    const combsWithoutFirst = combinations(rest);
    const combsWithFirst = [];

    combsWithoutFirst.forEach(comb => {
        const combWithFirst = [...comb, firstEle];
        combsWithFirst.push(combWithFirst);
    })

    return [...combsWithFirst, ...combsWithoutFirst, [firstEle]];
}

console.log(combinations(["a", "b", "c"]));

// Time: O(2^n)
// Space: O(n)