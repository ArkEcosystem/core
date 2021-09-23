{
  "targets": [{
    "target_name": "native_metrics",
    "sources": [
      "src/native_metrics.cpp",
      "src/GCBinder.hpp",
      "src/GCBinder.cpp",
      "src/LoopChecker.hpp",
      "src/LoopChecker.cpp",
      "src/Metric.hpp",
      "src/RUsageMeter.hpp",
      "src/RUsageMeter.cpp"
    ],
    "defines": [
      "NOMINMAX"
    ],
    "include_dirs": [
      "src",
      "<!(node -e \"require('nan')\")"
    ]
  # }, {
  #   "target_name": "tests",
  #   "sources": [
  #     # Test deps and setup
  #     "src/tests/gtest/gtest.h",
  #     "src/tests/gtest-all.cc",
  #     "src/tests/main.cpp",
  #
  #     # Actual tests
  #     "src/tests/metrics_test.cpp"
  #   ],
  #   "defines": [
  #     "NOMINMAX"
  #   ],
  #   "include_dirs": [
  #     "src",
  #     "<!(node -e \"require('nan')\")"
  #   ]
  }]
}
