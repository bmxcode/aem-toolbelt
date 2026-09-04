# Summary

<!-- What console does this affect, and what value does it surface / what does it fix? -->

## Checklist

- [ ] One enhancer per console gap; registered in `src/enhancers/index.js` (if adding one).
- [ ] `appliesTo` is DOM-signature based and specific to the target page (no hardcoded console URLs).
- [ ] `enhance()` is idempotent (`markOnce`) and safe to re-run on AEM's in-app navigation.
- [ ] Injected links use `link()`; injected classes are `aem-tb-`-prefixed.
- [ ] `npm run build` succeeds and I verified the result on a real AEM console.
- [ ] No real/internal instance data (hostnames, `/content/dam` paths, emails) in code, docs, or screenshots.

## Notes

<!-- AEM version tested, screenshots, anything reviewers should know. -->
