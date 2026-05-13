-- List users and count their notes
SELECT u.id, u.email, u."clerkId", COUNT(n.id) as note_count
FROM "User" u
LEFT JOIN "Note" n ON n."userId" = u.id
GROUP BY u.id, u.email, u."clerkId";
