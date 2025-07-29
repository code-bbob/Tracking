import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalCount = 0,
  pageSize = 20,
  isLoading = false 
}) {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalCount)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-3 ">
      
      <div className="flex items-center space-x-2">
        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="h-8 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page indicator */}
        <span className="text-sm text-gray-600 px-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="h-8 px-3"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}