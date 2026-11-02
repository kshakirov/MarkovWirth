gh issue view $1 \
   --repo kshakirov/MarkovWirth \
  --json number,title,state,author,createdAt,updatedAt,url,body,comments \
  --template '{{printf "# Issue #%v — %s\n\n" .number .title}}
**State:** {{.state}}
**Author:** @{{.author.login}}
**Created:** {{.createdAt}}
**Updated:** {{.updatedAt}}
**URL:** {{.url}}

---

{{.body}}

---

## Comments

{{range .comments}}
### @{{.author.login}} — {{.createdAt}}

{{.body}}

---
{{end}}' > issue-$1.md
