import io
from matplotlib import pyplot as plt
from graphics import plots as grph


def get_violin_plot_image(year, track, session, num_drivers):
    fig, ax = grph.get_lap_time_distributions_violin(year, track, session, num_drivers)
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig) 
    return buf


def get_scatter_plot_image(year, track, session, driver):
    fig, ax = grph.get_laps_driver_scatterplot(year, track, session, driver)
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return buf


def get_qualifying_results_overview(year, track):
    fig, ax = grph.get_qualifying_results_overview(year, track)

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return buf


def get_driver_laps_json(year, track, session, driver):
    data, error = grph.get_driver_laps_data(year, track, session, driver)
    if error:
        return {"error": error}
    return data


def get_violin_data_json(year, track, session, num_drivers):
    data, error = grph.get_lap_distributions_data(year, track, session, num_drivers)
    if error:
        return {"error": error}
    return data


def get_qualy_overview_json(year, track):
    data, error = grph.get_qualifying_results_data(year, track)
    if error:
        return {"error": error}
    return data
