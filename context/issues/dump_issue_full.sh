gh issue view $1 \
  --repo kshakirov/MarkovWirth \
  --json number,title,state,author,createdAt,updatedAt,url,body,comments \
  > issue-$1.json
