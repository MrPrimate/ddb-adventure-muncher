const getAllSQL = `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
`;

const getChaptersSQL = `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
WHERE CobaltID IS NOT NULL
`;

function getChapterContentSQL(cobaltId) {
    return `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
WHERE ParentId = '${cobaltId}'
`;
}

exports.getAllSQL = getAllSQL;
exports.getChaptersSQL = getChaptersSQL;
exports.getChapterContentSQL = getChapterContentSQL;
