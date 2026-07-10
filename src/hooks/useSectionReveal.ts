import { useCallback } from "react"

export default function useSectionReveal() {
  const addSectionRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(node)
  }, [])

  return addSectionRef
}